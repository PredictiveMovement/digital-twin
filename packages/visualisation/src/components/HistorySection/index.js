import styled from 'styled-components'

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
`
const HistorySection = () => {
  return (
    <MenuContainer>
      <p>Time</p>
    </MenuContainer>
  )
}

export default HistorySection
