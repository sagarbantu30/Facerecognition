import React, { useState, useRef, useEffect } from "react";
// import "./App.css";
import parrot from "./Assects/parrot.gif";
import "./Voiceassist.css";
import { v4 as uuidv4 } from "uuid";
import annyang from "annyang";
import * as faceapi from "face-api.js";
import { Get, Notemploy, Put } from "./Network/Endpoints";
import parrot1 from "./Assects/idle parrot.gif";
// import parrot2 from "./Assects/parrot hearing.gif";
// import parrot3 from "./Assects/parrot speaking.gif";
import parrot4 from "./Assects/parrot weaving hand.gif";

const Test2 = () => {
  const videoRef = useRef(null);
  const [Uploadresult, setUploadresult] = useState(
    "Place ur face in camera viewpoint for recognition"
  );
  const [isAuth, setAuth] = useState(false);
  const [id, setId] = useState("");
  var welcometext;
  const canvasRef = useRef(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentImage, setCurrentImage] = useState(`${parrot}`);
  const [message, setMessage] = useState();

  let previousFaceParams = null;

  function speak(text) {
    const parrotVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.name === "Google UK English Female");
    const text_speak = new SpeechSynthesisUtterance(text);
    if (parrotVoice) {
      text_speak.voice = parrotVoice;
    }
    text_speak.rate = 1;
    text_speak.volume = 2;
    text_speak.pitch = 1.4;
    window.speechSynthesis.speak(text_speak);
  }

  useEffect(() => {
    // Change the image after 5000 milliseconds (5 seconds)
    const timeoutId = setTimeout(() => {
      setCurrentImage(parrot1);
    }, 4200);

    return () => clearTimeout(timeoutId);
  }, []);
  useEffect(() => {
    startVideo();
    videoRef && loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const loadModels = () => {
    Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("/models")]).then(
      () => {
        faceMyDetect();
      }
    );
  };
  const faceMyDetect = async () => {
      const canvasContainer = document.getElementById("canvas-container");

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      );

    //   canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
    //     videoRef.current
    //   );
    //   faceapi.matchDimensions(canvasRef.current, {
    //     width: 940,
    //     height: 650,
    //   });
    canvasContainer.innerHTML = "";


      const resized = faceapi.resizeResults(detections, {
        width: 640,
        height: 550,
      });

      resized.forEach((face, index) => {
        const canvas = faceapi.createCanvasFromMedia(videoRef.current);
        canvas.id = `face-canvas-${index}`; // Set a unique identifier for each canvas
        canvasContainer.appendChild(canvas);
  
        faceapi.matchDimensions(canvas, {
          width: 940,
          height: 650,
        });
  
        faceapi.draw.drawDetections(canvas, [face]);
      });

      // Check if faces are detected
      if (resized.length > 0 && !faceDetected) {
        setFaceDetected(true);

        if (!areFaceParamsSimilar(resized, previousFaceParams)) {
          captureImage();
          previousFaceParams = resized;
        }
      } else if (resized.length === 0) {
        setFaceDetected(false);
      }
    }, 1000);
  };

  const areFaceParamsSimilar = (currentParams, previousParams) => {
    if (!previousParams) {
      return false;
    }

    // Check if the number of faces is the same
    if (currentParams.length !== previousParams.length) {
      return false;
    }

    // Check if face positions are similar (adjust the threshold as needed)
    const positionThreshold = 100; // Adjust this threshold based on your requirements

    for (let i = 0; i < currentParams.length; i++) {
      const currentFace = currentParams[i];
      const previousFace = previousParams[i];

      const distanceX = Math.abs(currentFace._box.x - previousFace._box.x);
      const distanceY = Math.abs(currentFace._box.y - previousFace._box.y);

      if (distanceX > positionThreshold || distanceY > positionThreshold) {
        return false;
      }
    }
    return true;
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg");

        fetch(imageData)
          .then((res) => res.blob())
          .then((blob) => {
            const visitorImageName = uuidv4();
            fetch(Put + `${visitorImageName}.jpeg`, {
              method: "PUT",
              headers: {
                "Content-Type": "image/jpeg",
              },
              body: blob,
            })
              .then(async () => {
                const response = await authenticate(visitorImageName);
                if (response.Message === "Success") {
                  setAuth(true);
                  welcometext = `Hi ${response.firstName} ${response.lastName}, Welcome`;
                  setUploadresult(welcometext);
                  speak(welcometext);
                  setId(response.rekognitionId);
                  setCurrentImage(parrot4);
                  setTimeout(function () {
                    setCurrentImage(parrot1);
                  }, 4000);
                } else {
                  setAuth(false);
                  setUploadresult(response.Message);
                  setMessage(response.Message);
                  console.log(message);
                  console.log(id);
                  speak("do you want to register");
                  annyang.start();
                  annyang.addCommands({
                    yes: function () {
                      speak(
                        "your request for registratuion has been forwarded to HR department"
                      );
                      fetch(imageData)
                        .then((res) => res.blob())
                        .then((blob) => {
                          const unregisteredvisitorImage = uuidv4();
                          fetch(
                            Notemploy + `${unregisteredvisitorImage}.jpeg`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "image/jpeg",
                              },
                              body: blob,
                            }
                          ).then(async () => {
                            console.log("success", response);
                          });
                        });
                    },
                    no: function () {
                      annyang.abort();
                    },
                  });
                }
              })
              .catch((error) => {
                setAuth(false);
                setUploadresult(
                  "Error during authentication. Try again later."
                );
                console.error("Error uploading image:", error);
              });
          });
      }
    }
  };

  const authenticate = async (visitorImageName) => {
    try {
      const response = await fetch(Get + `${visitorImageName}.jpeg`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    } catch (error) {
      console.error("Error authenticating:", error);
      return { Message: "Error during authentication" };
    }
  };

  return (
    <section className="main">
      <div className="image-container">
        <div className="image">
          <img src={currentImage} alt="" />
        </div>
        <h1>P A R R O T</h1>
        <p>I'm a Virtual Assistant Parrot, How can I help you?</p>
        <video
          crossOrigin="anonymous"
          ref={videoRef}
          autoPlay
          style={{ display: "none" }}
        ></video>
        <canvas
          ref={canvasRef}
          width="940"
          height="650"
          className="appcanvas"
          style={{ display: "none" }}
        />
        <div
          className={isAuth ? "Success" : "failure"}
          style={{ color: "white" }}
        >
          {}
        </div>
      </div>
      <div className="input">
        <h1 className="content"> {Uploadresult}</h1>
      </div>
    </section>
  );
};

export default Test2;
