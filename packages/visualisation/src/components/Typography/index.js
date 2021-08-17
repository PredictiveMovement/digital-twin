import styled from 'styled-components'

const Paragraph = styled.p`
  margin: 0;
  font-weight: ${(props) => (props.thin ? 300 : 400)};
  font-size: 12pt;
  font-family: 'Roboto', sans-serif;
  color: white;
`

const H4 = styled.h4`
  color: white;
  margin: 0;
`

export { Paragraph, H4 }
