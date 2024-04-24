export default {
  extends: ["eslint-config-standard"],
  rules: {
    // Add your custom rules here
    "no-unused-vars": "warn",
    "no-undef": "warn",
  },
};
// import styleGuide from "eslint-config-standard";
//
// export default [
//   ...[].concat(styleGuide),
//   js.configs.recommended,
//   {
//     rules: {
//       "no-unused-vars": "warn",
//       "no-undef": "warn",
//     },
//   },
// ];

// module.exports = {
//   extends: ["eslint-config-standard", "eslint-config-standard-jsx"],
//   rules: {
//     // Add your custom rules here
//     "no-unused-vars": "warn",
//     "no-undef": "warn",
//   },
// };
