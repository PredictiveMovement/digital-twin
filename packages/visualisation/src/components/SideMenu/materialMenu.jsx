import React, { useState } from 'react'
import styled from 'styled-components'
/*import pmLogo from '../../icons/svg/pmLogo.svg'
import experimentIcon from '../../icons/svg/experimentIcon.svg'
import historyIcon from '../../icons/svg/historyIcon.svg'
import menuActive from '../../icons/svg/menuActive.svg'
import pencilIcon from '../../icons/svg/pencil.svg'
import SavedExperimentSection from '../SavedExperimentSection'
import ExperimentSection from '../ExperimentSection'
import NewExperimentSection from '../NewExperimentSection'*/

import InboxIcon from '@mui/icons-material/MoveToInbox'
import MailIcon from '@mui/icons-material/Mail'
import SvgIcon, { Button, Icon } from '@mui/material'
import logo from '../../icons/svg/pmLogo.svg'

import { keyframes } from 'styled-components'
import {
  Box,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
} from '@mui/material'

const pulseAnimation = keyframes`
  0%
  {
    transform: scale( 1.2 );
  }
  50%
  {
    transform: scale( .90 );
  }
  100%
  {
    transform: scale( 1.2 );
  }
`

const Menu = styled.nav`
  background-color: #10c57b;
  bottom: 0;
  left: 0;
  top: 0;
  position: absolute;
  cursor: auto;
  z-index: 5;
`

const List = styled.ol`
  margin: 0;
  padding: 0;
`

const MenuItem = styled.li`
  cursor: pointer;
  margin: 4rem 1rem 0 1rem;
  list-style-type: none;
  display: flex;
  align-items: center;
  z-index: 4;

  img {
    width: 32px;
  }
`

const ActiveMenu = styled.div`
  margin-left: 1.2rem;
  z-index: 10;
  position: absolute;
  left: 2.6rem;
`

const PulseIcon = styled.img`
  animation-name: ${pulseAnimation};
  animation-duration: 2s;
  animation-iteration-count: infinite;
`

const SideMenu = ({
  activeLayers,
  currentParameters,
  newParameters,
  newExperiment,
  setNewParameters,
  fleets,
}) => {
  const [open, setOpen] = useState(true)
  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return
    }
    setOpen(open)
  }

  return (
    <>
      <SwipeableDrawer
        anchor={'left'}
        open={open}
        onClose={toggleDrawer(false)}
        onOpen={toggleDrawer(true)}
        swipeAreaWidth={300}
        disableSwipeToOpen={false}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Box
          sx={{
            width: 300,
            backgroundColor: '#10c57b',
          }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <Icon>
                    <img src={logo} alt="PM Icon" />
                  </Icon>
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <InboxIcon />
                </ListItemIcon>
                <ListItemText primary="Experiment" />
              </ListItemButton>
            </ListItem>
          </List>
          <Divider />
        </Box>
      </SwipeableDrawer>
    </>
  )
}

export default SideMenu
