import { useState } from 'react'
import styled from 'styled-components'
import PmLogo from '../../icons/svg/PmLogo'
import History from '../../icons/svg/History'
import Guide from '../../icons/svg/Guide'
import MenuArrow from '../../icons/svg/MenuArrow'
import { Paragraph, H1 } from '../Typography'
import DropDown from '../DropDown'

const Menu = styled.nav`
  background-color: #10c57b;
  bottom: 0;
  left: 0;
  top: 0;
  position: absolute;
  cursor: auto;
`

const List = styled.ol`
  margin: 0;
  padding: 0;
`

const MenuItem = styled.li`
  cursor: pointer;
  margin-top: 64px;
  margin: 4rem 1rem 0 1rem;
  list-style-type: none;
  display: flex;
  align-items: center;
  z-index: 4;
`

const MenuContainer = styled.div`
  width: 300px;
  background-color: white;
  position: absolute;
  bottom: 0;
  left: 3.8rem;
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 2.5rem;
  top: 0;
`

const ActiveMenu = styled.div`
  margin-left: 1.2rem;
  z-index: 4;
`

const SideMenu = () => {
  const [open, setOpen] = useState('map')

  return (
    <>
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
            <Guide />
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
            <History />
            {open === 'history' && (
              <ActiveMenu>
                <MenuArrow />
              </ActiveMenu>
            )}
          </MenuItem>
        </List>
      </Menu>
      {open === 'guide' && (
        //To do: break out to own component?
        <MenuContainer>
          <H1>Guide</H1>
          <Paragraph black>
            I den här guiden hittar du information om Predictive Movements
            digitala tvilling.
          </Paragraph>

          <DropDown title="Färgkoder">
            <>
              <p>Färginfo</p>
            </>
          </DropDown>
          <DropDown title="Navigering">
            <>
              <p>Navigering</p>
            </>
          </DropDown>
        </MenuContainer>
      )}

      {open === 'history' && (
        //To do: break out to own component?
        <MenuContainer>
          <p>Time</p>
        </MenuContainer>
      )}
    </>
  )
}

export default SideMenu
