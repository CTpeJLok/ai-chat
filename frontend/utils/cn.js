import tw from 'twrnc'
import clsx from 'clsx'

const cn = (...args) => {
  return tw([clsx(args)])
}

export default cn
