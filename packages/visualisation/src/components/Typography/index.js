import styled from 'styled-components'

const Paragraph = styled.p`
  margin: 0;
  font-weight: ${(props) => (props.thin ? 300 : 400)};
  /* font-size: 12pt; */
  font-size: 14px;
  font-family: 'Roboto', sans-serif;
  color: ${(props) => (props.black ? 'black' : 'white')};
`

const H4 = styled.h4`
  color: white;
  margin: 0;
`

const H1 = styled.h1`
  font-size: 20px;
  margin: 0;
`

const H2 = styled.h2`
  font-size: 18px;
  margin: 0;
`

const H3 = styled.h3`
  font-size: 14px;
  margin: 0;
`

export { Paragraph, H4, H1, H2, H3 }
