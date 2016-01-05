require 'omniauth'

class ClientController < ApplicationController
  def index
    if (!session[:user_id])
      redirect_to '/auth/cas'
    end
    @token = "foo"
  end

  def login
    session[:user_id] = request.env['omniauth.auth']['uid']
    redirect_to '/'
  end
end
