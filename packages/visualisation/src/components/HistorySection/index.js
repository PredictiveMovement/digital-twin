import styled from 'styled-components'
import { H1, Paragraph } from '../Typography'
import DropDown from '../DropDown'

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
const HistorySection = () => {
  return (
    <MenuContainer>
      <H1>Experiment</H1>
      <DropDown title="Pågående expriment">
        <DropDown small title="Experimentpremisser">
          <Paragraph black> Premisser</Paragraph>
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
