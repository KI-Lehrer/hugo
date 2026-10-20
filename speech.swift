import Foundation
import AVFoundation

// Public macOS speech APIs only. Text arrives on stdin and is never logged.
let args = CommandLine.arguments
if args.count == 2 && args[1] == "list" {
    let voices = AVSpeechSynthesisVoice.speechVoices().filter {
        $0.language.hasPrefix("de") && $0.quality.rawValue > 1
    }.map { ["id": $0.identifier, "name": $0.name, "language": $0.language] }
    let bytes = try JSONSerialization.data(withJSONObject: voices)
    FileHandle.standardOutput.write(bytes)
    exit(0)
}
guard args.count == 4, args[1] == "render",
      let voice = AVSpeechSynthesisVoice(identifier: args[2]),
      voice.language.hasPrefix("de"), voice.quality.rawValue > 1 else { exit(2) }
let bytes = FileHandle.standardInput.readDataToEndOfFile()
guard let text = String(data: bytes, encoding: .utf8), !text.isEmpty else { exit(2) }
let synth = AVSpeechSynthesizer()
let utterance = AVSpeechUtterance(string: text)
utterance.voice = voice
utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.96
var done = false
var failed = false
var audioFile: AVAudioFile?
var frames: AVAudioFrameCount = 0
synth.write(utterance) { buffer in
    guard let pcm = buffer as? AVAudioPCMBuffer else { return }
    if pcm.frameLength == 0 { done = true; return }
    do {
        if audioFile == nil {
            audioFile = try AVAudioFile(forWriting: URL(fileURLWithPath: args[3]), settings: pcm.format.settings)
        }
        try audioFile?.write(from: pcm)
        frames += pcm.frameLength
    } catch { failed = true; done = true }
}
let deadline = Date().addingTimeInterval(50)
while !done && Date() < deadline { RunLoop.current.run(until: Date().addingTimeInterval(0.02)) }
audioFile = nil
exit(done && !failed && frames > 0 ? 0 : 3)
