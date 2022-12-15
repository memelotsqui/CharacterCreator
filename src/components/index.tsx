import { createTheme, ThemeProvider } from "@mui/material"
import React, { Suspense, useState, useEffect, Fragment } from "react"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
//import DownloadCharacter from "./Download"
//import LoadingOverlayCircularStatic from "./LoadingOverlay"
import { apiService, sceneService } from "../services"
//import { startAnimation } from "../library/animations/animation"
import { AnimationManager } from "../library/animations/animationManager"
import { VRM  } from "@pixiv/three-vrm"
import Scene from "./Scene"
import { useSpring, animated } from 'react-spring'
import * as THREE from 'three'
import { ManageSearchRounded } from "@mui/icons-material"
import { useRandomFlag, useAvatar, useLoadedTraits, useScene, useTemplateInfo, useModel, useLoading, useEnd } from "../store"

interface Avatar{
  skin:Record<string, unknown>,
  body:Record<string, unknown>,
  chest:Record<string, unknown>,
  head:Record<string, unknown>,
  neck:Record<string, unknown>,
  hand:Record<string, unknown>,
  ring:Record<string, unknown>,
  waist:Record<string, unknown>,
  weapon:Record<string, unknown>,
  legs:Record<string, unknown>,
  feet:Record<string, unknown>,
  accessories:Record<string, unknown>,
  outer:Record<string,unknown>,
  solo:Record<string,unknown>
}

export default function CharacterEditor(props: any) {
  // State Hooks For Character Editor ( Base ) //
  // ---------- //
  // Charecter Name State Hook ( Note: this state will also update the name over the 3D model. )
  // const [characterName, setCharacterName] =
  //   useState<string>("Character Name");
  // Categories State and Loaded Hooks
  // const [categories, setCategories] = useState([]);
  // const [categoriesLoaded, setCategoriesLoaded] =
  //   useState<boolean>(false);
  // TODO: Where is setNodes
  // const [nodes, setNodes] = useState<object>(Object);
  // const [materials, setMaterials] = useState<object>(Object);
  // const [animations, setAnimations] = useState<object>(Object);
  // const [body, setBody] = useState<any>();



  const { theme, setLoadingProgress } = props

  // Selected category State Hook

  // 3D Model Content State Hooks ( Scene, Nodes, Materials, Animations e.t.c ) //

  const [flagPass, setFlagPass] = useState<any>(false)
  
  // States Hooks used in template editor //
  const templateInfo = useTemplateInfo((state) => state.templateInfo)
  //const [downloadPopup, setDownloadPopup] = useState<boolean>(false)
  // const [loadedTraits, setLoadedTraits] = useState(false)
  
  const loadedTraits = useLoadedTraits((state) => state.loadedTraits)
  const setLoadedTraits = useLoadedTraits((state) => state.setLoadedTraits)
  const setRandomFlag = useRandomFlag((state) => state.setRandomFlag)
  const avatar = useAvatar((state) => state.avatar)
  const setScene = useScene((state) => state.setScene)
  const model = useModel((state) => state.model)
  const setModel = useModel((state) => state.setModel)
  const setLoading = useLoading((state) => state.setLoading)
  const setEnd = useEnd((state) => state.setEnd)

  const defaultTheme = createTheme({
    palette: {
      mode: "dark",
      primary: {
        main: "#de2a5e",
      },
    },
  })

  useEffect(()=>{
    if (loadedTraits === true){
      setTimeout (() => {
        setLoading(false)
        setEnd(true)
      }, 1000)
      setLoadedTraits(false)
    }
  }, [loadedTraits])


  useEffect(() => {
    if(avatar){
      sceneService.setTraits(avatar);
    }
  }, [avatar])

  useEffect(() => {
    if(templateInfo){
      sceneService.setAvatarTemplateInfo(templateInfo);
    }
  }, [templateInfo])


  const animatedStyle = useSpring({
    from: { opacity: "0"},
    to: { opacity: "1" },
    config: { duration: "2500" }
  })
  // const animatedStyle = {
  //   backgroundColor: "rgba(16,16,16,0.6)",
  //   color: "#efefef"
  // }

  useEffect(() => {
    if(model)
    sceneService.setAvatarModel(model);
  }, [model])
  
  useEffect( () => {

    if (templateInfo.file) {
      
      // create a scene that will hold all elements (decoration and avatar)
      const newScene = new THREE.Scene();
      setScene(newScene)

      // load part of the decoration (spinning base)
      sceneService.loadLottie('../Rotation.json',2,true).then((mesh) => {
        newScene.add(mesh);
        mesh.rotation.x = Math.PI / 2;
      });

      // load the avatar
      sceneService.loadModel(templateInfo.file)
        .then(async (vrm)=>{
          console.log(vrm.scene)
          //setLoadingProgress(100);
          const animationManager = new AnimationManager(templateInfo.offset);
          sceneService.addModelData(vrm, {animationManager:animationManager});

          if (templateInfo.animationPath){
            await animationManager.loadAnimations(templateInfo.animationPath);
            animationManager.startAnimation(vrm);
          }
            setTimeout(()=>{
              newScene.add (vrm.scene);
              // wIP
              sceneService.addModelData(vrm, {cullingLayer:0});

              sceneService.getSkinColor(vrm.scene,templateInfo.bodyTargets)
              setModel(vrm);
              setFlagPass(true)
            // setRandomFlag(1);
            },50);
        })
    }
  }, [templateInfo.file])

  useEffect(() => {
    if(flagPass) setRandomFlag(1)
  }, [flagPass])
 
  return (
    <Suspense fallback="loading...">
      <ThemeProvider theme={theme ?? defaultTheme}>
        {templateInfo && (
          <Fragment>
            <animated.div style={animatedStyle} >
              <Scene/>  
            </animated.div>
          </Fragment>
        )}
      </ThemeProvider>
    </Suspense>
  )
}
