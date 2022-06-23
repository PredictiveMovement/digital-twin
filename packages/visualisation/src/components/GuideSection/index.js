import styled from 'styled-components'
import DropDown from '../DropDown'
import { H1, Paragraph } from '../Typography'
import IdeaIcon from '../../icons/svg/IdeaIcon'

const Circle = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${(props) => props.backgroundColor};
`

const Flex = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-wrap: break-word;
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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const GuideSection = () => {
  const colorInfo = [
    { color: '#13C57B', type: 'Personbil' },
    { color: '#FF3030', type: 'Buss' },
    { color: '#FF97E2', type: 'Färdtjänst' },
  ]

  return (
    <MenuContainer>
      <Wrapper>
        <H1>Guide</H1>
        <Paragraph black>
          I den här guiden hittar du information om Predictive Movements
          digitala tvilling.
        </Paragraph>
      </Wrapper>

      <DropDown title="Färgkoder">
        {colorInfo.map((item) => {
          return (
            <Flex>
              <Circle backgroundColor={item.color} />
              <Paragraph black>{item.type}</Paragraph>
            </Flex>
          )
        })}
      </DropDown>

      <DropDown title="Navigering">
        <Flex>
          <IdeaIcon />
          <div style={{ maxWidth: '250px' }}>
            <Paragraph black>
              Ett tips om hur man kan navigera i den digitala tvillingen, lorem
              ipsum dolor sit amet, consectetur adipiscing elit.
            </Paragraph>
          </div>
        </Flex>
      </DropDown>
    </MenuContainer>
  )
}

export default GuideSection
