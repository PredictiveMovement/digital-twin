import styled from 'styled-components'
import { H1, H3, Paragraph } from '../Typography'
import DropDown from '../DropDown'
import checkIcon from '../../icons/svg/checkIcon.svg'
import { useState } from 'react'

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

const CheckItem = ({ text, setLayer }) => {
  const [checked, setChecked] = useState(true)
  return (
    <Flex>
      <Button
        checked={checked}
        onClick={() => {
          setChecked((current) => !current)
          setLayer((current) => !current)
          console.log('here?')
        }}
      ></Button>
      <ParagraphMedium black> {text}</ParagraphMedium>
    </Flex>
  )
}

const HistorySection = ({ activeLayers }) => {
  return (
    <MenuContainer>
      <H1>Experiment</H1>
      <DropDown title="Pågående expriment">
        <DropDown small title="Experimentpremisser">
          <ParagraphMedium black>
            Här kan du justera premisserna i ditt experiment. Du behöver starta
            om experimentet för att ändra premisserna.
          </ParagraphMedium>

          <H3>Fordon</H3>

          <CheckItem text="Buss" setLayer={activeLayers.setCarLayer} />
          {/* <CheckItem text="Buss" />
          <CheckItem text="Privatpersoners bilar" />
          <CheckItem text="Taxi" />
          <CheckItem text="Sjukresor" />
          <CheckItem text="Flygbil" />
          <CheckItem text="Skolskjuts" />
          <CheckItem text="Färdtjänst" /> */}
        </DropDown>
        <DropDown small title="Resultat">
          <Paragraph black>Här kan du se resultatet av experimentet.</Paragraph>
        </DropDown>
      </DropDown>
      <DropDown title="Sparade experiment">
        <Paragraph black>Sparat</Paragraph>
      </DropDown>
    </MenuContainer>
  )
}

export default HistorySection
