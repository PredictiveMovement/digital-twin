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

const ExperimentParametersSection = ({
  newParameters,
  newExperiment,
  setNewParameters,
}) => {
  const fleets = {
    'Helsingborgs stad': {
      fleets: [
        {
          name: 'Postnord',
          vehicles: {
            tungLastbil: 0,
            medeltungLastbil: 4,
            lättLastbil: 1,
            bil: 0,
          },
          marketshare: 0.6,
          hub: [13.101441, 55.601021],
        },
        {
          name: 'Röd',
          vehicles: {
            tungLastbil: 0,
            medeltungLastbil: 2,
          },
          marketshare: 0.18,
          hub: [13.046085, 55.554708],
        },
        {
          name: 'Gul',
          vehicles: {
            lättLastbil: 2,
          },
          marketshare: 0.06,
          hub: [13.104629, 55.60737],
        },
        {
          name: 'Lila',
          vehicles: {
            lättLastbil: 2,
          },
          marketshare: 0.06,
          hub: [13.367398, 55.536388],
        },
      ],
    },
  }

  const handleChange = (e) => {
    console.log('Update JSON', e['Helsingborgs stad'].fleets[0])
    console.log(fleetsJson['Helsingborgs stad'].fleets[0])
  }

  return (
    <MenuContainer>
      <Wrapper>
        <H1>Parametrarssssffffffff</H1>
        mmmm
        <Editor value={fleetsJson} onChange={handleChange} />
      </Wrapper>
    </MenuContainer>
  )
}

export default ExperimentParametersSection
