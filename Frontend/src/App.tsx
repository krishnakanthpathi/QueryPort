import Navbar from "./components/Navbar";
// import { GridScan } from "./components/GridScan";
// import Threads from "./components/Threads";

import Galaxy from "./components/Galaxy";

const App: React.FC = () => {

  return (
    <>
    <Navbar />
    <div className="w-screen h-screen" style={{  position: 'fixed' }}>
      {/* <GridScan /> */}
      {/* <Threads /> */}
      <Galaxy 
     
      />
    </div>
    </>
  );
};  

export default App;
