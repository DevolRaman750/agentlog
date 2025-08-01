// Mock for @expo/vector-icons to fix Jest testing
const MockIcon = ({ name, size, color, ...props }) => {
  return {
    type: 'Text',
    props: {
      ...props,
      children: name,
      style: { fontSize: size, color },
    },
  };
};

module.exports = {
  Ionicons: MockIcon,
  MaterialIcons: MockIcon,
  FontAwesome: MockIcon,
  Entypo: MockIcon,
  AntDesign: MockIcon,
  MaterialCommunityIcons: MockIcon,
  Feather: MockIcon,
  Foundation: MockIcon,
  EvilIcons: MockIcon,
  SimpleLineIcons: MockIcon,
  Octicons: MockIcon,
  Zocial: MockIcon,
}; 