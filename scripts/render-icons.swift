// Растеризує вихідні SVG іконки й splash у PNG точних розмірів.
// Запуск з кореня проєкту (інтерпретатор swift падає в AppKit, тому компілюємо):
//   swiftc -O scripts/render-icons.swift -o /tmp/render-icons && /tmp/render-icons
// Джерела й правила — assets/images/app/source/README.md
import AppKit

struct Job {
  let svg: String
  let png: String
  let size: Int
}

let source = "assets/images/app/source"
let target = "assets/images/app"
let jobs = [
  Job(svg: "icon-full.svg", png: "icon.png", size: 1024),
  Job(svg: "android-background.svg", png: "android-icon-background.png", size: 1024),
  Job(svg: "android-foreground.svg", png: "android-icon-foreground.png", size: 1024),
  Job(svg: "android-monochrome.svg", png: "android-icon-monochrome.png", size: 1024),
  Job(svg: "splash-mark.svg", png: "splash-icon.png", size: 1024),
]

func render(_ job: Job) throws {
  let url = URL(fileURLWithPath: "\(source)/\(job.svg)")
  guard let image = NSImage(contentsOf: url) else {
    throw NSError(domain: "render", code: 1, userInfo: [NSLocalizedDescriptionKey: "cannot read \(job.svg)"])
  }
  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: job.size, pixelsHigh: job.size,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
    isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)
  else { throw NSError(domain: "render", code: 2) }
  rep.size = NSSize(width: job.size, height: job.size)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let rect = NSRect(x: 0, y: 0, width: job.size, height: job.size)
  image.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1)
  NSGraphicsContext.restoreGraphicsState()
  guard let data = rep.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "render", code: 3)
  }
  try data.write(to: URL(fileURLWithPath: "\(target)/\(job.png)"))
  print("\(job.svg) -> \(target)/\(job.png) \(job.size)px")
}

do {
  for job in jobs { try render(job) }
} catch {
  FileHandle.standardError.write("render-icons: \(error.localizedDescription)\n".data(using: .utf8)!)
  exit(1)
}
