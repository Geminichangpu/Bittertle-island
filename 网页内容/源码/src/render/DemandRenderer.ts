/** The only frame scheduler. No self-scheduling render callback, polling, or damping. */
export class DemandRenderer {
  private pending: number | null = null;
  private visible = true;
  private disposed = false;
  private lastDraw = -Infinity;
  private frameLimit:30|60 = 60;
  frames = 0;
  requests = 0;
  constructor(private draw:()=>void, private raf:(fn:FrameRequestCallback)=>number = fn=>requestAnimationFrame(fn), private cancel:(id:number)=>void = id=>cancelAnimationFrame(id)) {}
  requestRender = () => {
    this.requests++;
    if (this.disposed || !this.visible || this.pending !== null) return;
    this.pending = this.raf(this.flush);
  };
  private flush=(time:number)=>{
    this.pending=null;if(this.disposed||!this.visible)return;
    // Wait only while a real invalidation is pending; never schedule after a completed draw.
    if(time-this.lastDraw<1000/this.frameLimit-.1){this.pending=this.raf(this.flush);return;}
    this.lastDraw=time;this.draw();this.frames++;
  };
  setFrameLimit(fps:30|60){this.frameLimit=fps;}
  setVisible(value:boolean){this.visible=value;if(!value && this.pending!==null){this.cancel(this.pending);this.pending=null;} if(value)this.requestRender();}
  get isPending(){return this.pending!==null;}
  renderNow(){if(this.disposed||!this.visible)return;if(this.pending!==null){this.cancel(this.pending);this.pending=null;}this.draw();this.frames++;}
  dispose(){this.disposed=true; if(this.pending!==null)this.cancel(this.pending);this.pending=null;}
}
