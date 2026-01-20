export const GuideScreenshot = ({ src, alt, caption }: { src: string; alt: string; caption?: string }) => (
  <div className="my-4">
    <div className="rounded-lg border overflow-hidden shadow-md">
      <img src={src} alt={alt} className="w-full h-auto" />
    </div>
    {caption && <p className="text-sm text-muted-foreground text-center mt-2 italic">{caption}</p>}
  </div>
);
