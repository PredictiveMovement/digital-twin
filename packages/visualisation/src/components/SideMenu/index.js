import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import pmLogo from '../../icons/svg/pmLogo.svg'
import plus from '../../icons/svg/plus.svg'
import experimentIcon from '../../icons/svg/experimentIcon.svg'
import historyIcon from '../../icons/svg/historyIcon.svg'
import menuActive from '../../icons/svg/menuActive.svg'
import SavedExperimentSection from '../SavedExperimentSection'
import ExperimentSection from '../ExperimentSection'
import NewExperimentSection from '../NewExperimentSection'
import useOutsideClick from '../../hooks/useClickOutside'
import { keyframes } from 'styled-components'

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
}) => {
  const ref = useRef()

  const [open, setOpen] = useState('map')

  useOutsideClick(ref, () => {
    setOpen('map')
  })
  return (
    <div ref={ref}>
      <Menu>
        <List>
          <MenuItem onClick={() => setOpen('map')}>
            <img src={pmLogo} alt="Logo" />
          </MenuItem>
          <MenuItem
            onClick={() =>
              setOpen((current) =>
                current === 'newExperiment' ? 'map' : 'newExperiment'
              )
            }
          >
            <img src={plus} alt="New Experiment" />
            {open === 'newExperiment' && (
              <ActiveMenu>
                <img src={menuActive} alt="Open" />
              </ActiveMenu>
            )}
          </MenuItem>
          <MenuItem
            onClick={() =>
              setOpen((current) =>
                current === 'experiment' ? 'map' : 'experiment'
              )
            }
          >
            <PulseIcon src={experimentIcon} alt="Experiment" />
            {open === 'experiment' && (
              <ActiveMenu>
                <img src={menuActive} alt="Open" />
              </ActiveMenu>
            )}
          </MenuItem>
          <MenuItem
            onClick={() =>
              setOpen((current) =>
                current === 'savedExperiment' ? 'map' : 'savedExperiment'
              )
            }
          >
            <img src={historyIcon} alt="Saved Experiment" />
            {open === 'savedExperiment' && (
              <ActiveMenu>
                <img src={menuActive} alt="Open" />
              </ActiveMenu>
            )}
          </MenuItem>
        </List>
      </Menu>
      {open === 'experiment' && (
        <ExperimentSection
          currentParameters={currentParameters}
          activeLayers={activeLayers}
        />
      )}
      {open === 'savedExperiment' && <SavedExperimentSection />}
      {open === 'newExperiment' && (
        <NewExperimentSection
          newParameters={newParameters}
          newExperiment={newExperiment}
          setNewParameters={setNewParameters}
        />
      )}
    </div>
  )
}

export default SideMenu
