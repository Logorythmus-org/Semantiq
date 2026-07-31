const config = {
  stories: ["../packages/ui/**/*.stories.@(ts|tsx|mdx)", "../apps/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  }
};

export default config;
