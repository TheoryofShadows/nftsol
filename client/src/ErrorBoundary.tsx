import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  constructor(props:any){ super(props); this.state = { error: undefined }; }
  static getDerivedStateFromError(error: Error){ return { error }; }
  componentDidCatch(err: any){ console.error("App crash:", err); }
  render(){
    if (this.state.error){
      return (
        <div style={{padding:16,fontFamily:"system-ui"}}>
          <h2>💥 App error</h2>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error.stack || this.state.error.message || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
