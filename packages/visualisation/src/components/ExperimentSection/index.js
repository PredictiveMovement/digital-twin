import styled from 'styled-components'
import Slider from '@mui/material/Slider'

import { H1, H3, Paragraph, ParagraphBold } from '../Typography'
import checkIcon from '../../icons/svg/checkIcon.svg'

const WhiteCircle = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 1px solid #ccc;
`

const Circle = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ backgroundColor = 'transparent' }) => backgroundColor};
`

const Donut = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 4px solid ${({ borderColor = 'transparent' }) => borderColor};
`

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 300px;
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

const Button = styled.button`
  width: 16px;
  height: 16px;
  background-color: #666666;
  border: none;
  border-radius: 2px;
  cursor: pointer;
  background-image: ${(props) => (props.checked ? `url(${checkIcon})` : null)};
  background-repeat: no-repeat;
  background-position: center;
`

const Flex = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`

const ParagraphMedium = styled(Paragraph)`
  font-size: 14px;
`

const FlexSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1rem 1.5rem;
`

const CheckItem = ({ text, setLayer, checked, color, borderOnly = false }) => {
  return (
    <Flex>
      <Button
        checked={checked}
        onClick={() => {
          setLayer((current) => !current)
        }}
      />
      {borderOnly ? (
        <Donut borderColor={color} />
      ) : color === '#FFFFFFAA' ? (
        <WhiteCircle />
      ) : (
        <Circle backgroundColor={color} />
      )}
      <ParagraphMedium black> {text}</ParagraphMedium>
    </Flex>
  )
}

const ExperimentSection = ({ activeLayers, currentParameters }) => {
  return (
    <MenuContainer>
      <H1>Pågående experiment</H1>
      <ParagraphMedium black>
        Experiment id: <strong>{currentParameters.id}</strong>
        <br />
        Starttid: <strong>{currentParameters.startDate}</strong>
      </ParagraphMedium>
      <ParagraphMedium black>
        Här kan ändra vad som visas i simuleringen till höger.
      </ParagraphMedium>

      <Container>
        <H3>Fordon</H3>
        <CheckItem
          text="Bussar"
          setLayer={activeLayers.setBusLayer}
          checked={activeLayers.busLayer}
          color="#E74493"
        />
        <CheckItem
          text="Busslinjer"
          setLayer={activeLayers.setBusLineLayer}
          checked={activeLayers.busLineLayer}
          color="#F00A1D"
        />
        <div style={{ marginBottom: '0.5rem', marginTop: '2rem' }}>
          <Slider
            aria-label="Custom marks"
            size="small"
            value={currentParameters.fixedRoute}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => `${value}%`}
            disabled
          />
          <FlexSpaceBetween>
            <Paragraph black small>
              Fasta
            </Paragraph>
            <Paragraph black small>
              Dynamiska
            </Paragraph>
          </FlexSpaceBetween>
        </div>
        <CheckItem
          text="Anropsstyrd Kollektivtrafik"
          setLayer={activeLayers.setTaxiLayer}
          checked={activeLayers.taxiLayer}
          color="#FBFF33AA"
        />
        <CheckItem
          text="Passagerare"
          setLayer={activeLayers.setPassengerLayer}
          checked={activeLayers.passengerLayer}
          color="#0080FFAA"
        />
        <CheckItem
          text="Busshållplatser"
          setLayer={activeLayers.setBusStopLayer}
          checked={activeLayers.busStopLayer}
          color="#FFFFFFAA"
        />
        <CheckItem
          text="Postombud"
          setLayer={activeLayers.setPostombudLayer}
          checked={activeLayers.postombudLayer}
          color="#13C57BAA"
        />
        <CheckItem
          text="Kommersiella distrikt"
          setLayer={activeLayers.setCommercialAreasLayer}
          checked={activeLayers.commercialAreasLayer}
          color="#0080FFAA"
          borderOnly
        />
        <CheckItem
          text="Kommungränser"
          setLayer={activeLayers.setKommunLayer}
          checked={activeLayers.kommunLayer}
          color="#13C57BAA"
          borderOnly
        />
      </Container>

      <Container>
        <H3>Resultat</H3>

        <ParagraphMedium black>
          Här kan du se resultatet av experimentet.
        </ParagraphMedium>

        <Grid>
          <ParagraphBold black>Antal fordon</ParagraphBold>
          <Paragraph black>Data</Paragraph>
          <ParagraphBold black>Antal resenärer</ParagraphBold>
          <Paragraph black>Data</Paragraph>
          <ParagraphBold black>CO2</ParagraphBold>
          <Paragraph black>Data</Paragraph>
          <ParagraphBold black>Genomsnittlig konstnad</ParagraphBold>
          <Paragraph black>Data</Paragraph>
          <ParagraphBold black>Medelfyllnadsgrad per bil</ParagraphBold>
          <Paragraph black>Data</Paragraph>
          <ParagraphBold black>Genomsnittlig restid</ParagraphBold>
          <Paragraph black>Data</Paragraph>
        </Grid>
      </Container>
    </MenuContainer>
  )
}

export default ExperimentSection
