import { useEffect, useRef } from 'react';

const STAR_COUNT = 200;

interface Star {
  x: number;
  y: number;
  sz: number;
  sp: number;
  op: number;
  ts: number;
  td: number;
}

interface ShootingStar {
  x: number;
  y: number;
  l: number;
  sp: number;
  op: number;
  a: number;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!canvas || !ctx) return;

    let starsArray: Star[] = [];
    let shootingStarsArray: ShootingStar[] = [];
    let animationFrameId: number;

    // Resize canvas to fill window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Create stars
    const createStars = () => {
      starsArray = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        starsArray.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          sz: Math.random() * 2,
          sp: Math.random() * 0.5 + 0.1,
          op: Math.random() * 0.5 + 0.3,
          ts: Math.random() * 0.02 + 0.01,
          td: Math.random() > 0.5 ? 1 : -1
        });
      }
    };

    // Create shooting star
    const createShootingStar = (): ShootingStar => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        l: Math.random() * 80 + 40,
        sp: Math.random() * 15 + 10,
        op: 1,
        a: Math.PI / 4
      };
    };

    // Draw stars
    const drawStars = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Regular stars
      for (let i = 0; i < starsArray.length; i++) {
        const s = starsArray[i];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.op})`;
        ctx.fill();

        s.y += s.sp;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }

        s.op += s.ts * s.td;
        if (s.op > 0.8 || s.op < 0.3) s.td *= -1;
      }

      // Shooting stars - filter dead ones
      shootingStarsArray = shootingStarsArray.filter(s => s.op > 0);
      for (let j = 0; j < shootingStarsArray.length; j++) {
        const ss = shootingStarsArray[j];
        ctx.save();
        ctx.translate(ss.x, ss.y);
        ctx.rotate(ss.a);

        const gradient = ctx.createLinearGradient(0, 0, ss.l, 0);
        gradient.addColorStop(0, `rgba(255,107,107,${ss.op})`);
        gradient.addColorStop(1, 'rgba(255,107,107,0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ss.l, 0);
        ctx.stroke();
        ctx.restore();

        ss.x += Math.cos(ss.a) * ss.sp;
        ss.y += Math.sin(ss.a) * ss.sp;
        ss.op -= 0.02;
      }

      // Randomly create new shooting stars
      if (Math.random() < 0.003) shootingStarsArray.push(createShootingStar());

      animationFrameId = requestAnimationFrame(drawStars);
    };

    // Initialize
    resizeCanvas();
    createStars();
    drawStars();

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
      createStars();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
