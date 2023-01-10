import { H1, H2, Paragraph } from '../Typography'
import styled from 'styled-components'

import Slider from '@mui/material/Slider'

// JSON Editor.
import { JsonEditor as Editor } from 'jsoneditor-react'
import 'jsoneditor-react/es/editor.min.css'

const FlexSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
`

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

const NewExperimentSection = ({
  fleets,
  newExperiment,
  newParameters,
  setNewParameters,
}) => {
  const updateFixedRoute = (e) => {
    setNewParameters({ ...newParameters, fixedRoute: e.target.value })
  }

  const updateFleetsJson = (updatedJson) => {
    console.log('Update JSON', updatedJson)
    setNewParameters({ ...newParameters, fleets: updatedJson })
  }

  return (
    <MenuContainer>
      <Wrapper>
        <H1>Parametrar</H1>

        <H2>Kollektivtrafik</H2>
        <Paragraph>
          Här styr du hur stor andel av kollektivtrafik som kör i linjetrafik
          och anropsstyrt.
        </Paragraph>
        <div style={{ marginBottom: '0.5rem', marginTop: '-0.7rem' }}>
          <Slider
            aria-label="Custom marks"
            size="small"
            value={newParameters.fixedRoute}
            onChange={updateFixedRoute}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
          />
          <FlexSpaceBetween>
            <Paragraph black small>
              Fasta rutter (linjetrafik)
            </Paragraph>
            <Paragraph black small>
              Dynamiska rutter (anropsstyrt)
            </Paragraph>
          </FlexSpaceBetween>
        </div>

        <H2>Flottor</H2>
        <Paragraph>
          Här kan du redigera flottorna som kör i respektive kommun. Ändringar
          du gör slår igenom när nytt experiment startar.
        </Paragraph>
        <Editor value={fleets} onChange={updateFleetsJson} />

        <H2>Nytt experiment</H2>
        <Paragraph>
          När du klickar på knappen nedan startar experimentet om med ovan valda
          parametrar.
        </Paragraph>
        <StyledButton type="submit" onClick={newExperiment}>
          Nytt experiment
        </StyledButton>

        <Paragraph></Paragraph>
      </Wrapper>
    </MenuContainer>
  )
}

export default NewExperimentSection
