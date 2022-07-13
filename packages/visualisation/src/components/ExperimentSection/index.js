import styled from 'styled-components'
import Slider from '@mui/material/Slider'

import { H1, H3, Paragraph } from '../Typography'
import checkIcon from '../../icons/svg/checkIcon.svg'
import { useSocket } from '../../hooks/useSocket'

const Circle = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${(props) => props.backgroundColor};
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
  gap: 1rem;
`

const CheckItem = ({ text, setLayer, checked, color }) => {
  return (
    <Flex>
      <Button
        checked={checked}
        onClick={() => {
          setLayer((current) => !current)
        }}
      />
      <Circle backgroundColor={color} />
      <ParagraphMedium black> {text}</ParagraphMedium>
    </Flex>
  )
}

const ExperimentSection = ({ activeLayers, fixedRoute, setFixedRoute }) => {
  const { socket } = useSocket()

  const onChange = (e) => {
    setFixedRoute(e.target.value)
    socket.emit('fixedRoute', e.target.value)
  }

  return (
    <MenuContainer>
      <H1>Pågående experiment</H1>
      <ParagraphMedium black>
        Här kan du justera premisserna i ditt experiment. Du behöver starta om
        experimentet för att ändra premisserna.
      </ParagraphMedium>

      <H3>Fordon</H3>
      <Container>
        <CheckItem
          text="Buss"
          setLayer={activeLayers.setCarLayer}
          checked={activeLayers.carLayer}
          color="#E74493"
        />
        <div style={{ marginBottom: '0.5rem', marginTop: '-0.7rem' }}>
          <Slider
            aria-label="Custom marks"
            size="small"
            value={fixedRoute}
            onChange={onChange}
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
          text="Postombud"
          setLayer={activeLayers.setPostombudLayer}
          checked={activeLayers.postombudLayer}
          color="#13C57B"
        />
      </Container>
      {/* <CheckItem text="Buss" />
          <CheckItem text="Privatpersoners bilar" />
          <CheckItem text="Taxi" />
          <CheckItem text="Sjukresor" />
          <CheckItem text="Flygbil" />
          <CheckItem text="Skolskjuts" />
          <CheckItem text="Färdtjänst" /> */}
      {/* <DropDown small title="Resultat">
          <Paragraph black>Här kan du se resultatet av experimentet.</Paragraph>
        </DropDown> */}
    </MenuContainer>
  )
}

export default ExperimentSection
