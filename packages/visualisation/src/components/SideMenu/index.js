import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import PmLogo from '../../icons/svg/PmLogo'
import HistoryIcon from '../../icons/svg/HistoryIcon'
import GuideIcon from '../../icons/svg/GuideIcon'
import MenuArrow from '../../icons/svg/MenuArrow'
import GuideSection from '../GuideSection'
import HistorySection from '../HistorySection'
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

const SideMenu = () => {
  const ref = useRef()

  const [open, setOpen] = useState('map')

  useOutsideClick(ref, () => {
    setOpen('map')
  })

  React.useEffect(() => {
    console.log(open)
  }, [open])

  return (
    <div ref={ref}>
      <Menu>
        <List>
          <MenuItem onClick={() => setOpen('map')}>
            <PmLogo />
          </MenuItem>
          <MenuItem
            onClick={() =>
              setOpen((current) => (current === 'guide' ? 'map' : 'guide'))
            }
          >
            <GuideIcon />
            {open === 'guide' && (
              <ActiveMenu>
                <MenuArrow />
              </ActiveMenu>
            )}
          </MenuItem>
          <MenuItem
            onClick={() =>
              setOpen((current) => (current === 'history' ? 'map' : 'history'))
            }
          >
            <HistoryIcon />
            {open === 'history' && (
              <ActiveMenu>
                <MenuArrow />
              </ActiveMenu>
            )}
          </MenuItem>
        </List>
      </Menu>
      {open === 'guide' && <GuideSection />}
      {open === 'history' && <HistorySection />}
    </div>
  )
}

export default SideMenu
