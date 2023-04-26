import React from 'react'
import { Box, Button, Modal, Typography } from '@mui/material'
import { JsonEditor as Editor } from 'jsoneditor-react'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  height: 600,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

const editorStyle = {
  border: '1px solid #dfdfdf',
  height: 480,
  overflow: 'scroll',
}

const closeButtonStyle = {
  marginLeft: '1rem',
}

const bottomStyle = {
  position: 'absolute',
  bottom: '1rem',
  width: '90%',
  paddingRight: '1rem',
}

const EditExperimentModal = ({
  fleets,
  show,
  setShow,
  restartSimulation,
  saveFleets,
}) => {
  return (
    <Modal
      open={show}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h5" component="h2">
          Redigera Experiment
        </Typography>
        <Box sx={editorStyle}>
          <Editor value={fleets} onChange={saveFleets} />
        </Box>
        <Box sx={bottomStyle}>
          <Typography id="modal-modal-description" sx={{ mb: 2, mt: 2 }}>
            Dina ändringar träder i kraft när experimentet startar om.
          </Typography>
          <Button variant="contained" onClick={restartSimulation}>
            Starta om experiment
          </Button>
          <Button
            variant="outlined"
            sx={closeButtonStyle}
            onClick={() => setShow(false)}
          >
            Stäng
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default EditExperimentModal
