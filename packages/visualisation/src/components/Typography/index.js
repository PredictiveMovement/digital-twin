const { default: styled } = require('styled-components')

const Paragraph = styled.p`
  margin: 0;
  font-weight: ${(props) => (props.thin ? 300 : 400)};
  font-size: 12pt;
  font-family: 'Roboto', sans-serif;
  color: white;
`

export default Paragraph
