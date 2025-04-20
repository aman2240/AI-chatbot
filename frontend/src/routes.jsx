import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import UploadPDF from "./pages/UploadPDF";
import TextToAudio from "./pages/TextToAudio";
export default function RoutesComponent() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/upload-pdf" element={<UploadPDF />} />
      <Route path="/text-to-audio" element={<TextToAudio/>}></Route>
    </Routes>
  );
}
