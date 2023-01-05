import Slider from '@mui/material/Slider'
import styled from 'styled-components'
import { H1, Paragraph } from '../Typography'
import { JsonEditor as Editor } from 'jsoneditor-react'
import 'jsoneditor-react/es/editor.min.css'

import fleetsJson from './fleets.json'

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 600px;
  background-color: white;
  position: absolute;
  bottom: 0;
  left: 3.8rem;
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 2.5rem;
  top: 0;
  z-index: 4;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const FlexSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
`

const StyledButton = styled.button`
  width: 140px;
  height: 40px;
  background-color: #10c57b;
  border: none;
  z-index: 2;
  cursor: pointer;
  font-size: 14px;
  font-family: Arial, Helvetica, sans-serif;
  border-radius: 2px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`

const NewExperimentSection = ({
  newParameters,
  newExperiment,
  setNewParameters,
}) => {
  const onChange = (e) => {
    setNewParameters({ ...newParameters, fixedRoute: e.target.value })
  }

  const handleChange = (e) => {
    console.log('Update JSON')
    console.log(e)
  }

  return (
    <MenuContainer>
      <Wrapper>
        <H1>Parametrar</H1>

        <Editor value={fleetsJson} onChange={handleChange} />
      </Wrapper>
    </MenuContainer>
  )
}

export default NewExperimentSection
