/*
let experimentUrl =
    "https://kibana.predictivemovement.se/app/kibana#/dashboard/767e6ae0-3ac8-11ed-bade-51cc9f3c8210?_g=(refreshInterval:(pause:!t,value:0),time:(from:now%2Fd,to:now%2Fd))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(mapCenter:!n,mapZoom:4),gridData:(h:15,i:'91cb1203-69c3-4398-8253-39ad96a9a9db',w:24,x:0,y:0),id:'65cf5470-3ac8-11ed-bade-51cc9f3c8210',panelIndex:'91cb1203-69c3-4398-8253-39ad96a9a9db',type:visualization,version:'7.5.1'),(embeddableConfig:(),gridData:(h:15,i:bfff9c2e-acd3-412a-a3ff-056b2bc25ddb,w:24,x:24,y:0),id:'57aab970-3ac8-11ed-bade-51cc9f3c8210',panelIndex:bfff9c2e-acd3-412a-a3ff-056b2bc25ddb,type:visualization,version:'7.5.1'),(embeddableConfig:(),gridData:(h:15,i:c47eb77d-b191-4a9b-9a04-127c581b4dcd,w:24,x:0,y:15),id:'9973b280-3ac8-11ed-bade-51cc9f3c8210',panelIndex:c47eb77d-b191-4a9b-9a04-127c581b4dcd,type:visualization,version:'7.5.1'),(embeddableConfig:(isLayerTOCOpen:!f,mapCenter:(lat:66.58123,lon:24.83098,zoom:4.37),openTOCDetails:!()),gridData:(h:15,i:c278a0ec-d11d-49d9-8606-2a9d3fb98342,w:24,x:24,y:15),id:c52ada20-3acd-11ed-bade-51cc9f3c8210,panelIndex:c278a0ec-d11d-49d9-8606-2a9d3fb98342,type:map,version:'7.5.1'),(embeddableConfig:(),gridData:(h:17,i:f2374bbc-382e-4266-be64-09c5def6c71e,w:48,x:0,y:30),id:'3f728310-3c21-11ed-bade-51cc9f3c8210',panelIndex:f2374bbc-382e-4266-be64-09c5def6c71e,type:visualization,version:'7.5.1')),query:(language:kuery,query:'EXPERIMENT_ID'),timeRestore:!f,title:Overview,viewMode:view)"

  experimentUrl = experimentUrl.replace(/EXPERIMENT_ID/, experimentId)

  window.open(experimentUrl, '_blank')
*/

import React from 'react'
import { Box, Button, Modal, Typography } from '@mui/material'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  color: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

const ExperimentDoneModal = ({ experimentId, show, setShow }) => {
  const openKibana = () => {
    console.log('Open', experimentId)
    window.open(
      `https://kibana.predictivemovement.se/app/kibana#/dashboard/767e6ae0-3ac8-11ed-bade-51cc9f3c8210?_g=(refreshInterval:(pause:!t,value:0),time:(from:now%2Fd,to:now%2Fd))&_a=(description:'',filters:!(),fullScreenMode:!f,options:(hidePanelTitles:!f,useMargins:!t),panels:!((embeddableConfig:(mapCenter:!n,mapZoom:4),gridData:(h:15,i:'91cb1203-69c3-4398-8253-39ad96a9a9db',w:24,x:0,y:0),id:'65cf5470-3ac8-11ed-bade-51cc9f3c8210',panelIndex:'91cb1203-69c3-4398-8253-39ad96a9a9db',type:visualization,version:'7.5.1'),(embeddableConfig:(),gridData:(h:15,i:bfff9c2e-acd3-412a-a3ff-056b2bc25ddb,w:24,x:24,y:0),id:'57aab970-3ac8-11ed-bade-51cc9f3c8210',panelIndex:bfff9c2e-acd3-412a-a3ff-056b2bc25ddb,type:visualization,version:'7.5.1'),(embeddableConfig:(),gridData:(h:15,i:c47eb77d-b191-4a9b-9a04-127c581b4dcd,w:24,x:0,y:15),id:'9973b280-3ac8-11ed-bade-51cc9f3c8210',panelIndex:c47eb77d-b191-4a9b-9a04-127c581b4dcd,type:visualization,version:'7.5.1'),(embeddableConfig:(isLayerTOCOpen:!f,mapCenter:(lat:66.58123,lon:24.83098,zoom:4.37),openTOCDetails:!()),gridData:(h:15,i:c278a0ec-d11d-49d9-8606-2a9d3fb98342,w:24,x:24,y:15),id:c52ada20-3acd-11ed-bade-51cc9f3c8210,panelIndex:c278a0ec-d11d-49d9-8606-2a9d3fb98342,type:map,version:'7.5.1'),(embeddableConfig:(),gridData:(h:17,i:f2374bbc-382e-4266-be64-09c5def6c71e,w:48,x:0,y:30),id:'3f728310-3c21-11ed-bade-51cc9f3c8210',panelIndex:f2374bbc-382e-4266-be64-09c5def6c71e,type:visualization,version:'7.5.1')),query:(language:kuery,query:'${experimentId}'),timeRestore:!f,title:Overview,viewMode:view)`,
      '_blank'
    )
  }

  return (
    <Modal title="Experiment done" open={show}>
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h5" component="h2">
          Experiment klart
        </Typography>
        <Typography id="modal-modal-description" sx={{ mb: 2, mt: 2 }}>
          Nu har experimentet nått midnatt och startar om i bakgrunden. Du kan
          se resultatet i Kibana.
        </Typography>
        <Button variant="contained" onClick={openKibana}>
          Öppna kibana
        </Button>
        <Button
          variant="outlined"
          sx={{ ml: 2 }}
          onClick={() => setShow(false)}
        >
          Stäng
        </Button>
      </Box>
    </Modal>
  )
}

export default ExperimentDoneModal
