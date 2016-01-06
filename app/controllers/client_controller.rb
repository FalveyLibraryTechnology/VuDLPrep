require 'securerandom'

class ClientController < ApplicationController
  def index
    if (!session[:token] || !validate_token(session[:token]))
      redirect_to '/auth/cas'
    end
    @token = session[:token]
  end

  def login
    if request.env['omniauth.auth']['uid']
      token = Token.create(token: SecureRandom.uuid, expiration: Time.new + (60 * 60 * 24))
      session[:token] = token.token
    end
    redirect_to '/'
  end

  def logout
    if (session[:token])
      Token.where(token: session[:token]).destroy_all
    end
  end
end
