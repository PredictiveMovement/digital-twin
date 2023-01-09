import styled from 'styled-components'
import { H1, Paragraph } from '../Typography'
import { JsonEditor as Editor } from 'jsoneditor-react'
import 'jsoneditor-react/es/editor.min.css'

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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: scroll;
`

const ExperimentParametersSection = ({
  fleets,
  newExperiment,
  newParameters,
  setNewParameters,
}) => {
  const updateFleetsJson = (fleetsJson) => {
    console.log('Update JSON', fleetsJson)
    setNewParameters({ ...newParameters, fleets: fleetsJson })
  }

  return (
    <MenuContainer>
      <Wrapper>
        <H1>Parametrar</H1>
        <h2>fleets.json</h2>
        <Editor value={fleets} onChange={updateFleetsJson} />
        <StyledButton type="submit" onClick={newExperiment}>
          Nytt experiment
        </StyledButton>
      </Wrapper>
    </MenuContainer>
  )
}

export default ExperimentParametersSection
