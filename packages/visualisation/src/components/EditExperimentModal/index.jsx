import React from 'react'
import { Box, Button, Modal, Typography } from '@mui/material'
import { JsonEditor as Editor } from 'jsoneditor-react'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  color: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

const EditExperimentModal = ({
  fleets,
  show,
  setShow,
  resetSiulation,
  saveFleets,
}) => {
  return (
    <Modal
      open={show}
      onClose={() => setShow(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Redigera Experiment
        </Typography>
        <Editor value={fleets} onChange={saveFleets} />
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          Dina ändringar träder i kraft när experimentet startar om.
        </Typography>
        <Button variant="outlined" onClick={resetSiulation}>
          Starta om experiment
        </Button>
      </Box>
    </Modal>
  )
}

export default EditExperimentModal
