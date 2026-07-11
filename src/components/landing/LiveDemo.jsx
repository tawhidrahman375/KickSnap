import { Scissors, Crop, Users, Type, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Reveal from './Reveal'
import Eyebrow from './Eyebrow'

/**
 * PLACEHOLDER editor mockup. Once the real WebCodecs editor is built it gets
 * embedded here in a locked "Sign up to export" state (see spec §Live Demo).
 */
const TOOLS = [Scissors, Crop, Users, Type]

export default function LiveDemo() {
  return (
    <section className="border-t-2 border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal className="max-w-3xl">
          <Eyebrow>Live demo</Eyebrow>
          <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] uppercase leading-[0.9] tracking-tight text-foreground">
            Try it before
            <br />
            you sign up.
          </h2>
          <p className="mt-5 max-w-xl text-lg font-medium text-muted-foreground">
            The real editor, right here. Format, pick a streamer, add text — you
            only sign up to export.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="relative border-2 border-kick/40 bg-card p-3 shadow-[0_0_60px_-15px_rgba(83,252,24,0.25)]">
            {/* window chrome */}
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="size-3 bg-destructive/60" />
              <span className="size-3 bg-yellow-500/60" />
              <span className="size-3 bg-kick/60" />
            </div>

            <div className="flex gap-3 border-2 border-border bg-background/60 p-4">
              {/* tool rail */}
              <div className="flex flex-col gap-2">
                {TOOLS.map((Icon, i) => (
                  <div
                    key={i}
                    className="flex size-10 items-center justify-center border-2 border-border bg-card text-muted-foreground"
                  >
                    <Icon className="size-5" strokeWidth={2.5} />
                  </div>
                ))}
              </div>

              {/* preview */}
              <div className="flex flex-1 items-center justify-center py-4">
                <div
                  className="relative aspect-[9/16] w-44 overflow-hidden border-2 border-border sm:w-52"
                  style={{
                    background:
                      'linear-gradient(160deg, #1a2e12 0%, #2d5016 40%, #53fc18 70%, #1a2e12 100%)',
                  }}
                >
                  {/* caption */}
                  <div className="absolute inset-x-0 top-1/3 text-center">
                    <span
                      className="text-lg font-extrabold text-white uppercase sm:text-xl"
                      style={{ WebkitTextStroke: '1.5px black' }}
                    >
                      He actually
                      <br />
                      did it 😳
                    </span>
                  </div>
                  {/* kick overlay */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/85 py-2">
                    <span className="text-xs font-extrabold text-kick">KICK</span>
                    <span className="text-xs font-medium text-white">
                      kick.com/adinross
                    </span>
                  </div>
                </div>
              </div>

              {/* mini controls */}
              <div className="hidden w-32 flex-col gap-2 sm:flex">
                <div className="border-2 border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Format
                  <div className="mt-1 text-sm font-bold text-foreground">9:16 ✓</div>
                </div>
                <div className="border-2 border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Streamer
                  <div className="mt-1 text-sm font-bold text-foreground">Adin Ross</div>
                </div>
                <div className="border-2 border-border bg-card px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  Effect
                  <div className="mt-1 text-sm font-bold text-foreground">Blur bars</div>
                </div>
              </div>
            </div>

            {/* locked export */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                9:16 · 1080p · H.264
              </span>
              <Button className="gap-2 rounded-none bg-kick font-bold uppercase tracking-wide text-black hover:bg-kick-hover">
                <Lock className="size-4" strokeWidth={2.5} />
                Sign up to export
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
