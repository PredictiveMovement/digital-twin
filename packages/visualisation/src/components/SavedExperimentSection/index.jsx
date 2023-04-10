import styled from 'styled-components'
import { H1, Paragraph } from '../Typography'

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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const SavedExperimentSection = () => {
  return (
    <MenuContainer>
      <Wrapper>
        <H1>Sparade experiment</H1>
        <Paragraph black>Här kan du se resultatet av experimentet.</Paragraph>
      </Wrapper>
    </MenuContainer>
  )
}

export default SavedExperimentSection
