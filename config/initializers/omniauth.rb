Rails.application.config.middleware.use OmniAuth::Builder do
  provider :cas, host: 'login.villanova.edu', url: 'https://login.villanova.edu/cas'
end
