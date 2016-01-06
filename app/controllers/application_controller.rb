class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :null_session

  def holding_path
    config = Rails.application.config_for(:vudl)
    if (config["holding_area_path"])
      config["holding_area_path"]
    else
      "/usr/local/holding"
    end
  end

  def category_path(params)
    # Sanitize directory path component:
    category = params[:category].gsub(/\W/, '')

    # Build full path:
    "#{holding_path}/#{category}"
  end

  def job_path(params)
    # Sanitize directory path component:
    job = params[:job].gsub(/[^\w-]/, '')

    # Build full path:
    "#{category_path(params)}/#{job}"
  end

  def validate_token(token)
    validated_token = Token.find_by_token token
    validated_token && !validated_token.expired
  end

  def validate_token_in_auth_header
    authenticate_or_request_with_http_token do |token|
      validate_token token
    end
  end
end
