import { Theme } from "@radix-ui/themes";
import ModelHero from "./landing/ModelHero";

function App() {
  return (
    <Theme>
      <div
        style={{
          width: "100vw",
          height: "100svh",
          maxHeight: "100dvh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ModelHero />
      </div>
    </Theme>
  );
}

export default App;
