import React, { useEffect } from 'react'
import { Box, Button, Modal, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 700,
  height: 600,
  bgcolor: 'background.paper',
  color: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
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

export default function EditExperimentModal({
  municipalities,
  show,
  setShow,
  restartSimulation,
  saveMunicipalities,
}) {
  /**
   * DataGrid things.
   */
  const [rows, setRows] = React.useState(() => [])
  const columns = [
    { field: 'municipality', headerName: 'Kommun', width: 150 },
    { field: 'fleet', headerName: 'Flotta', width: 100 },
    { field: 'fleetType', headerName: 'Typ', width: 80 },
    { field: 'vehicles', headerName: 'Fordon', width: 80, editable: true },
    {
      field: 'marketSharePercent',
      headerName: 'Marknadsandel %',
      width: 150,
      editable: true,
    },
  ]

  /**
   * Load municipalities into DataGrid.
   */
  useEffect(() => {
    if (!municipalities) return

    console.log('Load', municipalities)
    setRows([])
    Object.keys(municipalities).forEach((municipality, i) => {
      municipalities[municipality].fleets.forEach((fleet, j) => {
        const row = {
          id: (i + 1) * 10 + j,
          municipality: municipality,
          fleet: fleet.name,
          fleetType: fleet.type,
          vehicles: 1,
          marketSharePercent: fleet.marketShare ?? 0,
        }

        console.log('Row', row)

        setRows((rows) => [...rows, row])

        // apiRef.current.updateRows([row])
      })

      // rows.push({
      //   id: municipality.id,
      //   municipality: municipality.municipality,
      //   fleet: fleet.name,
      //   fleetType: fleet.type,
      //   vehicles: fleet.vehicles,
      //   marketSharePercent: fleet.marketSharePercent,
      // })
    })
  }, [municipalities])

  return (
    <Modal
      open={show}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography
          id="modal-modal-title"
          variant="h5"
          component="h2"
          sx={{ mb: 2 }}
        >
          Redigera Experiment
        </Typography>
        <Box>
          <DataGrid
            columns={columns}
            rows={rows}
            style={{ height: 350, width: '100%' }}
            initialState={{
              pagination: { paginationModel: { pageSize: 5 } },
            }}
            pageSizeOptions={[5, 10]}
          ></DataGrid>
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
