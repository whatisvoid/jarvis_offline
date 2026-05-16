use std::collections::VecDeque;
use std::time::Duration;

#[allow(dead_code)]
pub struct WavSource {
    frames: VecDeque<Vec<i16>>,
    frame_length: usize,
    frame_duration: Duration,
    pub total_frames: usize,
}

impl WavSource {
    pub fn load(path: &str, frame_length: usize, target_rate: u32) -> Result<Self, String> {
        let mut reader = hound::WavReader::open(path)
            .map_err(|e| format!("[AUDIO_TEST] Cannot open WAV '{}': {}", path, e))?;

        let spec = reader.spec();
        let src_channels = spec.channels;
        let src_rate = spec.sample_rate;

        info!("[AUDIO_TEST] WAV file loaded:");
        info!("[AUDIO_TEST]   path         = {}", path);
        info!("[AUDIO_TEST]   sample_rate  = {} Hz", src_rate);
        info!("[AUDIO_TEST]   channels     = {}", src_channels);
        info!("[AUDIO_TEST]   bit_depth    = {} bit", spec.bits_per_sample);
        info!("[AUDIO_TEST]   format       = {:?}", spec.sample_format);

        let raw = read_as_i16(&mut reader)?;

        let mono = if src_channels > 1 {
            info!("[AUDIO_TEST]   converting {} channels -> mono", src_channels);
            to_mono(&raw, src_channels)
        } else {
            raw
        };

        let pcm = if src_rate != target_rate {
            info!("[AUDIO_TEST]   resampling {} Hz -> {} Hz", src_rate, target_rate);
            resample_linear(&mono, src_rate, target_rate)
        } else {
            mono
        };

        let total_samples = pcm.len();
        let duration_secs = total_samples as f32 / target_rate as f32;

        let mut frames: VecDeque<Vec<i16>> = VecDeque::new();
        for chunk in pcm.chunks(frame_length) {
            let mut frame = vec![0i16; frame_length];
            frame[..chunk.len()].copy_from_slice(chunk);
            frames.push_back(frame);
        }
        let total_frames = frames.len();

        let frame_duration = Duration::from_micros(
            (frame_length as u64 * 1_000_000) / target_rate as u64,
        );

        info!("[AUDIO_TEST]   total_samples ({}Hz) = {}", target_rate, total_samples);
        info!("[AUDIO_TEST]   duration             = {:.2}s", duration_secs);
        info!("[AUDIO_TEST]   frame_size           = {} samples", frame_length);
        info!("[AUDIO_TEST]   total_frames         = {}", total_frames);
        info!("[AUDIO_TEST]   frame_duration       = {}ms", frame_duration.as_millis());
        info!("[AUDIO_TEST] Pipeline replay active — feeding frames now");

        Ok(Self { frames, frame_length, frame_duration, total_frames })
    }

    pub fn next_frame(&mut self) -> Option<Vec<i16>> {
        self.frames.pop_front()
    }

    pub fn frame_duration(&self) -> Duration {
        self.frame_duration
    }

    #[allow(dead_code)]
    pub fn is_empty(&self) -> bool {
        self.frames.is_empty()
    }
}

fn read_as_i16(
    reader: &mut hound::WavReader<std::io::BufReader<std::fs::File>>,
) -> Result<Vec<i16>, String> {
    let spec = reader.spec();
    match spec.sample_format {
        hound::SampleFormat::Float => reader
            .samples::<f32>()
            .map(|s| {
                s.map(|v| (v.clamp(-1.0, 1.0) * i16::MAX as f32) as i16)
                    .map_err(|e| e.to_string())
            })
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| format!("[AUDIO_TEST] WAV read error: {}", e)),
        hound::SampleFormat::Int => {
            if spec.bits_per_sample <= 16 {
                // hound allows reading <=16 bit int as i16 directly
                reader
                    .samples::<i16>()
                    .map(|s| s.map_err(|e| e.to_string()))
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| format!("[AUDIO_TEST] WAV read error: {}", e))
            } else {
                // 24-bit: hound returns raw signed 24-bit range (-8388608..8388607)
                // 32-bit: hound returns full i32 range
                // Scale to i16 by right-shifting (bits_per_sample - 16) bits.
                let shift = (spec.bits_per_sample - 16) as i32;
                reader
                    .samples::<i32>()
                    .map(|s| {
                        s.map(|v| (v >> shift) as i16)
                            .map_err(|e| e.to_string())
                    })
                    .collect::<Result<Vec<_>, _>>()
                    .map_err(|e| format!("[AUDIO_TEST] WAV read error: {}", e))
            }
        }
    }
}

fn to_mono(samples: &[i16], channels: u16) -> Vec<i16> {
    samples
        .chunks(channels as usize)
        .map(|ch| {
            let sum: i32 = ch.iter().map(|&s| s as i32).sum();
            (sum / channels as i32) as i16
        })
        .collect()
}

fn resample_linear(samples: &[i16], from_rate: u32, to_rate: u32) -> Vec<i16> {
    if samples.is_empty() {
        return Vec::new();
    }
    let ratio = from_rate as f64 / to_rate as f64;
    let out_len = ((samples.len() as f64) / ratio).ceil() as usize;
    (0..out_len)
        .map(|i| {
            let pos = i as f64 * ratio;
            let left = pos.floor() as usize;
            let right = (left + 1).min(samples.len() - 1);
            let frac = pos - left as f64;
            (samples[left] as f64 * (1.0 - frac) + samples[right] as f64 * frac).round() as i16
        })
        .collect()
}
