import styled from 'styled-components'
import { H1, H2, Paragraph } from '../Typography'
import { JsonEditor as Editor } from 'jsoneditor-react'
import 'jsoneditor-react/es/editor.min.css'

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;

  gap: 2rem;
  width: 700px;
  background-color: white;
  z-index: 4;

  position: absolute;
  top: 0;
  bottom: 0;
  left: 3.8rem;

  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 2.5rem;
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

  margin-right: 1rem;
  margin-left: 1rem;
`

const ExperimentParametersSection = ({
  fleets,
  newExperiment,
  newParameters,
  setNewParameters,
}) => {
  const updateFleetsJson = (updatedJson) => {
    console.log('Update JSON', updatedJson)
    setNewParameters({ ...newParameters, fleets: updatedJson })
  }

  return (
    <MenuContainer>
      <Wrapper>
        <H1>Parametrar</H1>

        <H2>Flottor</H2>
        <Paragraph>
          Här kan du redigera flottorna som kör i respektive kommun. Ändringar
          du gör slår igenom när nytt experiment startar.
        </Paragraph>
        <Editor value={fleets} onChange={updateFleetsJson} />

        <H2>Spara</H2>
        <StyledButton type="submit" onClick={newExperiment}>
          Nytt experiment
        </StyledButton>

        <Paragraph></Paragraph>
      </Wrapper>
    </MenuContainer>
  )
}

export default ExperimentParametersSection
