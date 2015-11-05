Rails.application.routes.draw do
  get 'api/:category/:job/:image/thumb', to: 'image#thumb', as: 'thumb', :constraints => { :image => /[^\/]+/ }
  get 'api/:category/:job/:image/medium', to: 'image#medium', as: 'medium', :constraints => { :image => /[^\/]+/ }
  get 'api/:category/:job/:image/large', to: 'image#large', as: 'large', :constraints => { :image => /[^\/]+/ }

  get 'api/:category/:job/status', to: 'metadata#status'
  put 'api/:category/:job/derivatives', to: 'metadata#make_derivatives'

  get 'api/:category/:job', to: 'metadata#index'
  put 'api/:category/:job', to: 'metadata#update'

  get 'api/:category', to: 'list#category'

  get 'api', to: 'list#index', as: 'api'

  get '/', to: 'client#index', as: 'home'
  
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
