class BaseHttpObject
    attr_accessor :logger

    protected

  def check_http_error(response)
    error = false
    if (!response)
      error = "No response to POST"
    end
    if (response && response.code[0] != "2")
      error = "Unexpected response: #{response.code} #{response.message} #{response.body}"
    end
    if (error)
      log error
      raise error
    end
  end

  def do_get(uri, params)
    uri.query = URI.encode_www_form(params)
    response = Net::HTTP.get_response(uri)
    check_http_error response
    response.body
  end

  def do_http(req, uri, body, mime)
    req.basic_auth api_username, api_password
    req.body = body
    if (mime)
      req.add_field('Content-Type', mime)
    end
    response = Net::HTTP.new(uri.host, uri.port).start {|http| http.request(req)}
    check_http_error response
    response
  end

  def do_post(uri, body = nil, mime = nil)
    req = Net::HTTP::Post.new(uri)
    do_http(req, uri, body, mime)
  end

  def do_put(uri, body = nil, mime = nil)
    req = Net::HTTP::Put.new(uri)
    do_http(req, uri, body, mime)
  end

  def log(msg)
    if (logger)
      logger.info msg
    end
  end
end