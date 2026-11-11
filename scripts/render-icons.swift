// Растеризує вихідні SVG іконки й splash у PNG точних розмірів.
// Запуск з кореня проєкту (інтерпретатор swift падає в AppKit, тому компілюємо):
//   swiftc -O scripts/render-icons.swift -o /tmp/render-icons && /tmp/render-icons
// Джерела й правила — assets/images/app/source/README.md
import AppKit

struct Job {
  let svg: String
  let png: String
  let width: Int
  let height: Int
  // PNG без альфа-каналу (для зображень на весь кадр без прозорості)
  let opaque: Bool

  init(svg: String, png: String, size: Int) {
    self.init(svg: svg, png: png, width: size, height: size)
  }

  init(svg: String, png: String, width: Int, height: Int, opaque: Bool = false) {
    self.svg = svg
    self.png = png
    self.width = width
    self.height = height
    self.opaque = opaque
  }
}

let source = "assets/images/app/source"
let target = "assets/images/app"
let jobs = [
  Job(svg: "icon-full.svg", png: "icon.png", size: 1024),
  Job(svg: "android-background.svg", png: "android-icon-background.png", size: 1024),
  Job(svg: "android-foreground.svg", png: "android-icon-foreground.png", size: 1024),
  Job(svg: "android-monochrome.svg", png: "android-icon-monochrome.png", size: 1024),
  Job(svg: "splash-mark.svg", png: "splash-icon.png", size: 1024),
  // Повноекранний системний splash iOS: 402×874 pt @3x, градієнт накладки й
  // знак. Без альфа-каналу: прозорість на весь кадр не потрібна, а launch
  // screen бере менше памʼяті
  Job(svg: "splash-full-ios.svg", png: "splash-full-ios.png", width: 1206, height: 2622, opaque: true),
]

func render(_ job: Job) throws {
  let url = URL(fileURLWithPath: "\(source)/\(job.svg)")
  guard let image = NSImage(contentsOf: url) else {
    throw NSError(domain: "render", code: 1, userInfo: [NSLocalizedDescriptionKey: "cannot read \(job.svg)"])
  }
  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: job.width, pixelsHigh: job.height,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true,
    isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)
  else { throw NSError(domain: "render", code: 2) }
  rep.size = NSSize(width: job.width, height: job.height)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
  let rect = NSRect(x: 0, y: 0, width: job.width, height: job.height)
  image.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1)
  NSGraphicsContext.restoreGraphicsState()
  let output = URL(fileURLWithPath: "\(target)/\(job.png)")
  if job.opaque {
    try writeOpaquePNG(rep, to: output)
  } else {
    guard let data = rep.representation(using: .png, properties: [:]) else {
      throw NSError(domain: "render", code: 3)
    }
    try data.write(to: output)
  }
  print("\(job.svg) -> \(target)/\(job.png) \(job.width)×\(job.height)px")
}

// Перемальовує RGBA у контекст без альфи й пише PNG RGB
func writeOpaquePNG(_ rep: NSBitmapImageRep, to url: URL) throws {
  guard let source = rep.cgImage,
    let context = CGContext(
      data: nil, width: source.width, height: source.height, bitsPerComponent: 8,
      bytesPerRow: 0, space: CGColorSpace(name: CGColorSpace.sRGB)!,
      bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)
  else { throw NSError(domain: "render", code: 4) }
  context.draw(source, in: CGRect(x: 0, y: 0, width: source.width, height: source.height))
  guard let opaque = context.makeImage(),
    let destination = CGImageDestinationCreateWithURL(url as CFURL, "public.png" as CFString, 1, nil)
  else { throw NSError(domain: "render", code: 5) }
  CGImageDestinationAddImage(destination, opaque, nil)
  guard CGImageDestinationFinalize(destination) else { throw NSError(domain: "render", code: 6) }
}

do {
  for job in jobs { try render(job) }
} catch {
  FileHandle.standardError.write("render-icons: \(error.localizedDescription)\n".data(using: .utf8)!)
  exit(1)
}
