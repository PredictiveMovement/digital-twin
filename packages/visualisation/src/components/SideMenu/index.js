import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import pmLogo from '../../icons/svg/pmLogo.svg'
import experimentIcon from '../../icons/svg/experimentIcon.svg'
import historyIcon from '../../icons/svg/historyIcon.svg'
import menuActive from '../../icons/svg/menuActive.svg'
import SavedExperimentSection from '../SavedExperimentSection'
import ExperimentSection from '../ExperimentSection'
import useOutsideClick from '../../hooks/useClickOutside'

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

const SideMenu = ({ activeLayers, fixedRoute, setFixedRoute }) => {
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
                current === 'experiment' ? 'map' : 'experiment'
              )
            }
          >
            <img src={experimentIcon} alt="Experiment" />
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
            <img src={historyIcon} alt="savedExperiment" />
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
          activeLayers={activeLayers}
          fixedRoute={fixedRoute}
          setFixedRoute={setFixedRoute}
        />
      )}
      {open === 'savedExperiment' && <SavedExperimentSection />}
    </div>
  )
}

export default SideMenu
