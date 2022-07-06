import styled from 'styled-components'
import { H1, ParagraphLarge } from '../Typography'
import Button from '../Button'
import React from 'react'

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  backdrop-filter: blur(1px);
  z-index: 100;
  display: ${(props) => (props.showWelcomeBox ? 'block' : 'none')};
`

const Container = styled.div`
  padding: 3rem;
  background-color: #fdfeff;
  z-index: 5;
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 580px;
  height: 350px;

  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
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
  const [showWelcomeBox, setShowWelcomeBox] = React.useState(true)

  React.useEffect(() => {
    if (getCookie('hideWelcomeBox')) {
      setShowWelcomeBox(false)
    }
  }, [document.cookie])

  const getCookie = (name) => {
    const cookieArr = document.cookie.split(';')
    for (let i = 0; i < cookieArr.length; i++) {
      const cookiePair = cookieArr[i].split('=')
      if (name === cookiePair[0].trim()) {
        return decodeURIComponent(cookiePair[1])
      }
    }
    return null
  }

  const setCookie = () => {
    //Cookie lives for 30 days
    document.cookie = 'hideWelcomeBox=true; max-age=' + 30 * 24 * 60 * 60
    setShowWelcomeBox(false)
  }

  return (
    <Wrapper showWelcomeBox={showWelcomeBox}>
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
          <Button text="Okej" onClick={() => setCookie()} block />
        </ButtonWrapper>
      </Container>
    </Wrapper>
  )
}

export default WelcomeBox
