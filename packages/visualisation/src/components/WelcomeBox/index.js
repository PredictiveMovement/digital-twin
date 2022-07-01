import styled from 'styled-components'
import { H1, ParagraphLarge } from '../Typography'
import Button from '../Button'

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  backdrop-filter: blur(1px);
  z-index: 100;
`

const Container = styled.div`
  padding: 3rem;
  background-color: #fdfeff;
  z-index: 5;
  position: absolute;
  top: 30%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  left: 40%;
`

const Link = styled.a`
  color: black;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
`

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`

const WelcomeBox = () => {
  return (
    <Wrapper>
      <Container>
        <H1 large>
          Välkommen till Predictive Movements <br /> digitala tvilling
        </H1>
        <ParagraphLarge black>
          Predictive Movements digitala tvilling är en simulering av <br />
          kollektivtrafiken i Norrbotten där vi utför experiment för att se hur{' '}
          <br />
          kollektivtrafiken kan optimeras för bästa service till boende på{' '}
          <br />
          landsbygder.
          <br />
          <br />
          Den här digitala tvillingen är baserad på data från Länstrafiken i{' '}
          <br />
          Norrbotten och statistik om befolkningen.
        </ParagraphLarge>

        <Link target="_blank" href="https://predictivemovement.se/">
          Läs mer om Predictive Movement
        </Link>
        <ButtonWrapper>
          <Button text="Okej" onClick={() => console.log('close plz')} block />
        </ButtonWrapper>
      </Container>
    </Wrapper>
  )
}

export default WelcomeBox
