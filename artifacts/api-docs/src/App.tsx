import { useState } from "react";
import DocsPage from "@/pages/docs";

function App() {
  const [activeId, setActiveId] = useState("introduction");

  return <DocsPage activeId={activeId} setActiveId={setActiveId} />;
}

export default App;
