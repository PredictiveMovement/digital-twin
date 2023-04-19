import { useState } from 'react'
import styled from 'styled-components'
import { H2, H3 } from '../Typography'
import openArrow from '../../icons/svg/openArrow.svg'
import closeArrow from '../../icons/svg/closeArrow.svg'

const Arrow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background-color: inherit;
  cursor: pointer;
  padding: 0;
  gap: 1rem;
  z-index: 5;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: ${(props) => (props.small ? '1rem' : 0)};
  width: ${(props) => (props.small ? '90%' : '100%')};
`

const DropDown = ({ title, small, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <Wrapper small={small}>
      <Arrow onClick={() => setOpen((current) => !current)}>
        {small ? <H3>{title}</H3> : <H2>{title}</H2>}
        {open ? (
          <img src={closeArrow} alt="Close" />
        ) : (
          <img src={openArrow} alt="Open" />
        )}
      </Arrow>
      {open && children}
    </Wrapper>
  )
}

export default DropDown
